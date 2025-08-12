import React from 'react';
import {StyleSheet, View} from 'react-native';

interface AlternatingRowsListProps {
  children: React.ReactNode;
  colorEven?: [string, string, string];
  colorOdd?: [string, string, string];
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
}

function RowWrapper({
  children,
  index,
  isFirst,
  isLast,
  colors,
}: RowWrapperProps) {
  const isOdd = index % 2 === 1;

  const childWithProps = React.cloneElement(children as React.ReactElement, {
    isFirst,
    isLast,
    index,
  });

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

        isLast && styles.rowOuterLast,
        isFirst && styles.rowOuterFirst,
      ]}>
      <View
        style={[
          styles.rowInner,
          {backgroundColor: isOdd ? colors.odd[1] : colors.even[1]},
          isLast && styles.rowInnerLast,
          isFirst && styles.rowInnerFirst,
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
}: AlternatingRowsListProps) {
  // Convert children to array to get proper count and indexing
  const childrenArray = React.Children.toArray(children);

  const colors = {
    odd: colorOdd ?? ['692a00ff', '#783000', '#692a00'],
    even: colorEven ?? ['#D76D02', '#AA4E08', '#894400'],
  };

  return (
    <View style={styles.container}>
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
            colors={colors}>
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
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rowOuter: {},
  rowOuterLast: {
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
    paddingBottom: 3,
  },
  rowOuterFirst: {
    borderTopRightRadius: 25,
    borderTopLeftRadius: 25,
    paddingTop: 3,
  },
  rowInner: {
    paddingHorizontal: 3,
  },
  rowInnerLast: {
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
  },
  rowInnerFirst: {
    borderTopRightRadius: 25,
    borderTopLeftRadius: 25,
  },
});

export default AlternatingRowsList;
