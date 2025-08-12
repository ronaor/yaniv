import React from 'react';
import {StyleSheet, View} from 'react-native';

interface AlternatingRowsListProps {
  children: React.ReactNode;
  colorEven?: [string, string, string];
  colorOdd?: [string, string, string];
  cornerRadius?: number;
}

interface RowWrapperProps {
  children: React.ReactNode;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  colors: {
    odd: [string, string, string];
    even: [string, string, string];
  };
  cornerRadius?: number;
}

function RowWrapper({
  children,
  index,
  isFirst,
  isLast,
  colors,
  cornerRadius = 25,
}: RowWrapperProps) {
  const isOdd = index % 2 === 1;

  const childWithProps = React.cloneElement(children as React.ReactElement, {
    isFirst,
    isLast,
    index,
  });

  const rowFirst = {
    borderTopRightRadius: cornerRadius,
    borderTopLeftRadius: cornerRadius,
  };

  const rowLast = {
    borderBottomRightRadius: cornerRadius,
    borderBottomLeftRadius: cornerRadius,
  };

  const rowOuterFirst = {
    ...rowFirst,
    paddingTop: 3,
  };

  const rowOuterLast = {
    ...rowLast,
    paddingBottom: 3,
  };

  return (
    <View
      style={[
        styles.rowOuter,
        {
          backgroundColor: isOdd
            ? isFirst
              ? colors.odd[0]
              : colors.odd[2]
            : isFirst
            ? colors.even[0]
            : colors.even[2],
        },
        isLast && rowOuterLast,
        isFirst && rowOuterFirst,
      ]}>
      <View
        style={[
          styles.rowInner,
          {backgroundColor: isOdd ? colors.odd[1] : colors.even[1]},
          isLast && rowLast,
          isFirst && rowFirst,
        ]}>
        {childWithProps}
      </View>
    </View>
  );
}

function AlternatingRowsList({
  children,
  colorOdd,
  colorEven,
  cornerRadius = 25,
}: AlternatingRowsListProps) {
  // Convert children to array to get proper count and indexing
  const childrenArray = React.Children.toArray(children);

  const colors = {
    odd: colorOdd ?? ['692a00ff', '#783000', '#692a00'],
    even: colorEven ?? ['#D76D02', '#AA4E08', '#894400'],
  };

  return (
    <View style={[styles.container, {borderRadius: cornerRadius + 3}]}>
      {childrenArray.map((child, index) => {
        if (!child) {
          return null;
        }

        return (
          <RowWrapper
            key={index}
            index={index}
            isFirst={index === 0}
            isLast={index === childrenArray.length - 1}
            colors={colors}
            cornerRadius={cornerRadius}>
            {child}
          </RowWrapper>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#502404',
    padding: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rowOuter: {},
  rowInner: {
    paddingHorizontal: 3,
  },
});

export default AlternatingRowsList;
